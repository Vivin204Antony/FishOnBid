package com.FishOnBid.FishOnBid_Backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.FishOnBid.FishOnBid_Backend.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
}
